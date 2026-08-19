# The below role must be created in AWS IAM. This role will be assumed by the Github actions workflow.
# The role can be named as 'CustomRoleLambdaGithubCodeDeploy'.
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GitHubActionsOIDC",
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::104322896078:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:Ranuldeepanayake/lambda:ref:refs/heads/*"
        }
      }
    }
  ]
}

# Using terraform
resource "aws_iam_role" "github_actions_lambda_deploy" {
  name = "CustomRoleLambdaGithubCodeDeploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "GitHubActionsOIDC"
        Effect = "Allow"

        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          },
          "StringLike": {
            "token.actions.githubusercontent.com:sub": "repo:Ranuldeepanayake/lambda:ref:refs/heads/*"
          }
        }
      }
    ]
  })

The below policy must be added to the above role. It allows Github to perform the necessary actions on the Lambda function once the role has been assumed.
The OIDC identity provider is AWS. The OIDC provider is Github which requests an OIDC token from AWS.  
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "DeployLambda",
			"Effect": "Allow",
			"Action": [
				"lambda:GetFunction",
				"lambda:GetFunctionConfiguration",
				"lambda:UpdateFunctionCode",
				"lambda:UpdateFunctionConfiguration"
			],
			"Resource": "arn:aws:lambda:ap-southeast-1:104322896078:function:*"
		}
	]
}

# Using Terraform.
resource "aws_iam_role_policy" "github_actions_lambda_deploy" {
  name = "github-actions-lambda-deploy"

  role = aws_iam_role.github_actions_lambda_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "DeployLambda"
        Effect = "Allow"

        Action = [
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:UpdateFunctionCode"
        ]

        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:*"
      }
    ]
  })
}


  tags = {
    Name = "github-actions-lambda-deploy"
  }
}

# Create the Github OIDC provider using terraform.
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  tags = {
    Name = "github-actions"
  }
}